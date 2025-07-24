// 認証関連のユーティリティ関数

export const clearAuthData = () => {
  // ローカルストレージから認証関連データを全て削除
  localStorage.removeItem('token');
  localStorage.removeItem('remembered_email');
  
  // セッションストレージからも削除（念のため）
  sessionStorage.clear();
};

export const getStoredToken = () => {
  return localStorage.getItem('token');
};