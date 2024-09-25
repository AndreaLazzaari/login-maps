import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface AuthContextType {
    isLoggedIn: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        const token = Cookies.get('token');
        const loggedIn = !!token; // Verifica se il token esiste
        setIsLoggedIn(loggedIn);
        console.log('isLoggedIn:', loggedIn); // Logga il valore del token
    }, []);

    const login = () => {
        setIsLoggedIn(true);
        Cookies.set('token', 'your_token_here'); // Sostituisci con il tuo token effettivo
    };

    const logout = () => {
        setIsLoggedIn(false);
        Cookies.remove('token'); // Rimuovi il token al logout
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
