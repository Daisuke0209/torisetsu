import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 登録ページは廃止されたため、ログインページにリダイレクト
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
};

export default Register;