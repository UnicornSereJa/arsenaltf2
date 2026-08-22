import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Если маршрут требует определённых ролей
  if (allowedRoles.length > 0) {
    // Проверяем, есть ли у пользователя is_staff
    const hasAccess = allowedRoles.some(role => {
      if (role === 'admin') return user.is_staff === true;
      return user.role === role;
    });
    
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default PrivateRoute;