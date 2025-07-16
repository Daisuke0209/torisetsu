"""
Gemini API service for generating manuals from video content
"""
import os
import logging
import asyncio
from typing import Optional, Dict, Any, List
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import base64
import tempfile
import socket
import urllib3
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google.api_core import exceptions as google_exceptions
from config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        """Initialize Gemini service with API key from settings"""
        self.api_key = settings.gemini_api_key
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        # Configure network settings for better connectivity
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Configure the API with transport settings
        genai.configure(
            api_key=self.api_key,
            transport="rest"  # Use REST instead of gRPC to avoid DNS issues
        )
        
        # Initialize the model
        self.model_name = settings.gemini_model
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 8192,
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            }
        )
        
        logger.info(f"Gemini service initialized with model: {self.model_name}")

    async def _check_network_connectivity(self) -> None:
        """Check network connectivity to Google's services"""
        try:
            # Test DNS resolution
            socket.getaddrinfo('generativelanguage.googleapis.com', 443, socket.AF_UNSPEC, socket.SOCK_STREAM)
            logger.info("Network connectivity check passed")
        except socket.gaierror as e:
            logger.error(f"DNS resolution failed: {e}")
            raise ConnectionError(f"DNS resolution failed for Gemini API. Please check your internet connection and DNS settings: {e}")
        except Exception as e:
            logger.error(f"Network connectivity check failed: {e}")
            raise ConnectionError(f"Network connectivity issue: {e}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((google_exceptions.ServiceUnavailable, google_exceptions.TooManyRequests, ConnectionError))
    )
    async def generate_manual_from_video(
        self, 
        video_path: str, 
        title: str = "操作マニュアル",
        language: str = "ja"
    ) -> Dict[str, Any]:
        """
        Generate a step-by-step manual from a video file with retry logic
        
        Args:
            video_path: Path to the video file
            title: Title for the manual
            language: Language for the manual (default: ja for Japanese)
            
        Returns:
            Dictionary containing the generated manual content
        """
        try:
            logger.info(f"Generating manual from video: {video_path}")
            
            # Check network connectivity first
            await self._check_network_connectivity()
            
            # Validate video file
            if not os.path.exists(video_path):
                raise FileNotFoundError(f"Video file not found: {video_path}")
            
            # Check file size (Gemini has limits)
            file_size = os.path.getsize(video_path)
            max_size = 100 * 1024 * 1024  # 100MB
            if file_size > max_size:
                raise ValueError(f"Video file too large: {file_size} bytes (max: {max_size} bytes)")
            
            # Upload video to Gemini
            video_file = await self._upload_video_with_retry(video_path)
            
            # Generate manual content
            prompt = self._create_manual_prompt(title, language)
            
            # Generate content using the video
            response = await self._generate_content_with_video_retry(video_file, prompt)
            
            # Parse and structure the response
            manual_content = self._parse_manual_response(response, title)
            
            # Clean up uploaded file
            try:
                genai.delete_file(video_file.name)
                logger.info(f"Cleaned up uploaded video file: {video_file.name}")
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup uploaded file: {cleanup_error}")
            
            logger.info("Manual generation completed successfully")
            return manual_content
            
        except Exception as e:
            logger.error(f"Failed to generate manual from video: {str(e)}")
            # Provide more specific error information
            if "DNS resolution failed" in str(e) or "ServiceUnavailable" in str(e):
                raise ConnectionError(f"Network connectivity issue: {str(e)}. Please check internet connection and DNS settings.")
            elif "503" in str(e):
                raise google_exceptions.ServiceUnavailable(f"Gemini API service temporarily unavailable: {str(e)}")
            else:
                raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=8),
        retry=retry_if_exception_type((google_exceptions.ServiceUnavailable, google_exceptions.TooManyRequests, ConnectionError))
    )
    async def _upload_video_with_retry(self, video_path: str) -> Any:
        """Upload video file to Gemini with retry logic"""
        try:
            # Determine MIME type from file extension
            mime_type = "video/mp4"
            if video_path.lower().endswith(('.avi', '.AVI')):
                mime_type = "video/avi"
            elif video_path.lower().endswith(('.mov', '.MOV')):
                mime_type = "video/quicktime"
            elif video_path.lower().endswith(('.wmv', '.WMV')):
                mime_type = "video/x-ms-wmv"
            
            logger.info(f"Uploading video with MIME type: {mime_type}")
            
            # Upload the video file
            video_file = await asyncio.to_thread(
                genai.upload_file,
                path=video_path,
                mime_type=mime_type
            )
            
            # Wait for the file to be processed with timeout
            max_wait_time = 300  # 5 minutes
            wait_time = 0
            
            while video_file.state.name == "PROCESSING" and wait_time < max_wait_time:
                await asyncio.sleep(5)
                wait_time += 5
                video_file = await asyncio.to_thread(genai.get_file, video_file.name)
                logger.info(f"Video processing status: {video_file.state.name} (waited {wait_time}s)")
                
            if video_file.state.name == "FAILED":
                raise ValueError(f"Video processing failed: {video_file.state}")
                
            if video_file.state.name == "PROCESSING":
                raise TimeoutError(f"Video processing timeout after {max_wait_time} seconds")
                
            logger.info(f"Video uploaded and processed successfully: {video_file.name}")
            return video_file
            
        except Exception as e:
            logger.error(f"Failed to upload video: {str(e)}")
            # Provide more specific error messages
            if "DNS resolution failed" in str(e) or "ARES_STATUS" in str(e):
                raise ConnectionError(f"DNS/Network issue during video upload: {str(e)}. Please check your internet connection.")
            elif "503" in str(e) or "ServiceUnavailable" in str(e):
                raise google_exceptions.ServiceUnavailable(f"Gemini upload service temporarily unavailable: {str(e)}")
            elif "timeout" in str(e).lower():
                raise TimeoutError(f"Video upload timeout: {str(e)}")
            else:
                raise

    async def _upload_video(self, video_path: str) -> Any:
        """Legacy method - use _upload_video_with_retry instead"""
        return await self._upload_video_with_retry(video_path)

    def _create_manual_prompt(self, title: str, language: str) -> str:
        """Create prompt for manual generation"""
        if language == "ja":
            return f"""
この動画を分析して、ユーザーが実行すべき具体的な操作手順を日本語で作成してください。

タイトル: {title}

以下の形式で操作手順のみを作成してください：

## 操作手順

### ステップ1: [操作を表すシンプルなタイトル]
- **操作手順**: ユーザーが実行すべき具体的なアクション
- **時間**: 動画上の時間（例：0:15, 1:30など）

### ステップ2: [操作を表すシンプルなタイトル]
- **操作手順**: ユーザーが実行すべき具体的なアクション
- **時間**: 動画上の時間（例：0:15, 1:30など）

### ステップ3: [操作を表すシンプルなタイトル]
- **操作手順**: ユーザーが実行すべき具体的なアクション
- **時間**: 動画上の時間（例：0:15, 1:30など）

（同様の形式で全ての操作手順を続ける）

重要な指示：
- 各ステップは「ログイン」「メニュー選択」「データ入力」のようなシンプルなタイトルにしてください
- 操作手順は「〇〇をクリックしてください」「〇〇に移動してください」など、具体的な行動を記述してください
- 時間は動画上のタイムスタンプを正確に記録してください
- 動画で行われている操作を順番通りに、漏れなく記録してください
- 操作手順と時間の2項目のみを含めてください
"""
        else:
            return f"""
Analyze this video and create specific operational instructions that users should follow in English.

Title: {title}

Please create only the procedure section in the following format:

## Procedure

### Step 1: [Specific action title]
- **Action**: "Click on ○○", "Navigate to ○○", etc. - specific actions users should perform
- **Screen**: Which screen or page to operate on
- **Notes**: Important points to consider during operation
- **Verification**: How to confirm correct execution

### Step 2: [Specific action title]
- **Action**: "Click on ○○", "Navigate to ○○", etc. - specific actions users should perform
- **Screen**: Which screen or page to operate on
- **Notes**: Important points to consider during operation
- **Verification**: How to confirm correct execution

(Continue in similar format for all operation steps)

Important instructions:
- Each step title and action should indicate specific actions users should perform, like "Navigate to the branch", "Click the login button"
- Provide clear instructions for actual operations, not just descriptions
- Record all operations shown in the video in the correct sequence
- Do not include overview, prerequisites, troubleshooting, or additional information
"""

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((google_exceptions.ServiceUnavailable, google_exceptions.TooManyRequests, ConnectionError))
    )
    async def _generate_content_with_video_retry(self, video_file: Any, prompt: str) -> str:
        """Generate content using video and prompt with retry logic"""
        try:
            logger.info("Generating content with Gemini API")
            
            # Generate content with video
            response = await asyncio.to_thread(
                self.model.generate_content,
                [video_file, prompt]
            )
            
            if not response.text:
                raise ValueError("No response text generated from Gemini")
            
            # Check for content filtering
            if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                if response.prompt_feedback.block_reason:
                    raise ValueError(f"Content blocked by safety filters: {response.prompt_feedback.block_reason}")
            
            logger.info("Content generation completed successfully")
            return response.text
            
        except Exception as e:
            logger.error(f"Failed to generate content: {str(e)}")
            # Provide more specific error messages
            if "DNS resolution failed" in str(e) or "ServiceUnavailable" in str(e):
                raise google_exceptions.ServiceUnavailable(f"Gemini API temporarily unavailable: {str(e)}")
            elif "timeout" in str(e).lower():
                raise TimeoutError(f"Content generation timeout: {str(e)}")
            else:
                raise

    async def _generate_content_with_video(self, video_file: Any, prompt: str) -> str:
        """Legacy method - use _generate_content_with_video_retry instead"""
        return await self._generate_content_with_video_retry(video_file, prompt)

    def _parse_manual_response(self, response: str, title: str) -> Dict[str, Any]:
        """Parse the manual response into structured format"""
        try:
            # Extract sections from the response
            sections = self._extract_sections(response)
            
            # Structure the manual content
            manual_content = {
                "title": title,
                "overview": sections.get("概要") or sections.get("Overview", ""),
                "prerequisites": sections.get("前提条件") or sections.get("Prerequisites", ""),
                "steps": self._extract_steps(response),
                "troubleshooting": sections.get("トラブルシューティング") or sections.get("Troubleshooting", ""),
                "additional_info": sections.get("補足情報") or sections.get("Additional Information", ""),
                "raw_content": response
            }
            
            return manual_content
            
        except Exception as e:
            logger.error(f"Failed to parse manual response: {str(e)}")
            # Return raw content if parsing fails
            return {
                "title": title,
                "overview": "",
                "prerequisites": "",
                "steps": [],
                "troubleshooting": "",
                "additional_info": "",
                "raw_content": response
            }

    def _extract_sections(self, content: str) -> Dict[str, str]:
        """Extract sections from the manual content"""
        sections = {}
        current_section = None
        current_content = []
        
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            
            # Check if line is a section header
            if line.startswith('## '):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = line[3:].strip()
                current_content = []
            elif current_section and line:
                current_content.append(line)
        
        # Add the last section
        if current_section:
            sections[current_section] = '\n'.join(current_content).strip()
            
        return sections

    def _extract_steps(self, content: str) -> List[Dict[str, str]]:
        """Extract step-by-step instructions from the content"""
        steps = []
        current_step = None
        current_content = {}
        
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            
            # Check if line is a step header
            if line.startswith('### ステップ') or line.startswith('### Step'):
                if current_step:
                    steps.append(current_content)
                current_step = line[4:].strip()
                current_content = {
                    "title": current_step,
                    "action": "",
                    "screen": "",
                    "notes": "",
                    "verification": "",
                    "time": ""
                }
            elif current_step and line:
                # Extract specific fields
                if line.startswith('- **操作手順**:') or line.startswith('- **操作内容**:') or line.startswith('- **Action**:'):
                    current_content["action"] = line.split(':', 1)[1].strip()
                elif line.startswith('- **時間**:') or line.startswith('- **Time**:'):
                    current_content["time"] = line.split(':', 1)[1].strip()
                elif line.startswith('- **画面**:') or line.startswith('- **Screen**:'):
                    current_content["screen"] = line.split(':', 1)[1].strip()
                elif line.startswith('- **注意点**:') or line.startswith('- **Notes**:'):
                    current_content["notes"] = line.split(':', 1)[1].strip()
                elif line.startswith('- **確認事項**:') or line.startswith('- **Verification**:'):
                    current_content["verification"] = line.split(':', 1)[1].strip()
        
        # Add the last step
        if current_step:
            steps.append(current_content)
            
        return steps

    async def enhance_manual_content(self, manual_content: str, enhancement_type: str = "improve") -> str:
        """
        Enhance existing manual content
        
        Args:
            manual_content: Existing manual content
            enhancement_type: Type of enhancement (improve, translate, summarize)
            
        Returns:
            Enhanced manual content
        """
        try:
            if enhancement_type == "improve":
                prompt = f"""
以下のマニュアル内容をより分かりやすく、詳細に改善してください：

{manual_content}

改善点：
- より詳細な手順説明
- 分かりやすい表現
- 重要なポイントの強調
- エラー対処法の追加
"""
            elif enhancement_type == "translate":
                prompt = f"""
以下の日本語マニュアルを英語に翻訳してください：

{manual_content}
"""
            elif enhancement_type == "summarize":
                prompt = f"""
以下のマニュアル内容を要約して、重要なポイントのみを抽出してください：

{manual_content}
"""
            else:
                raise ValueError(f"Unknown enhancement type: {enhancement_type}")
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Failed to enhance manual content: {str(e)}")
            raise

# Create global instance
gemini_service = GeminiService()