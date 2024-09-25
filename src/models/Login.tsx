import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './Login.css'

interface Credenziali {
    username: string;
    password: string;
}

const Login: React.FC = () => {
    const [credenziali, setCredenziali] = useState<Credenziali>({ username: '', password: '' });
    const [errorMessage, setErrorMessage] = useState<string>('');
    const navigate = useNavigate();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredenziali({
            ...credenziali,
            [name]: value,
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Verifica le credenziali inserite
        if (credenziali.username === 'admin' && credenziali.password === 'admin') {
            try {
                const response = await fetch('/api/Login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json',
                    },
                    body: JSON.stringify({
                        username: credenziali.username,
                        password: credenziali.password,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Dati ricevuti:', data);
                    // navigazione in mappa
                    navigate('/mappa');

                    const token = data.data;
                    Cookies.set('token', token, { expires: 7 });
                    console.log('Login riuscito! Token salvato:', token);

                } else {
                    const errorData = await response.json();
                    console.log('Errore nella risposta:', errorData);
                    setErrorMessage('Errore durante il login');
                }
            } catch (error) {
                console.error('Errore durante il login:', error);
                setErrorMessage('Errore durante il login');
            }
        } else {
            setErrorMessage('Credenziali non valide');
        }
    };

    return (
        <div className="login-container">
            <img
                src="https://www.digitality-consulting.com/wp-content/uploads/2023/01/Logo-Digitality-Consulting-1000-%C3%97-1000-px.png"
                alt="Logo"
                className="logo"
            />
            <div className="login-card">
                <h2 className="title">Accedi al tuo account</h2>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                        <input
                            type="text"
                            name="username"
                            className="input-field"
                            value={credenziali.username}
                            onChange={handleChange}
                            placeholder="Username"
                        />
                    </div>

                    <div className="input-wrapper">
                        <input
                            type="password"
                            name="password"
                            className="input-field"
                            value={credenziali.password}
                            onChange={handleChange}
                            placeholder="Password"
                        />
                    </div>
                    <button type="submit" className="login-button">Login</button>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}

                    <div className="links">
                        <a href="#" className="forgot-password">Password dimenticata?</a>
                        <a href="#" className="register">Registrati</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
