import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginIcon from '@mui/icons-material/Login';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [modalLogged, setModalLogged] = useState(true);
  const navigate = useNavigate();

  async function VertisLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (response.ok) {
        setModalLogged(true);
        
        localStorage.setItem('isAuthenticated', 'true'); // Salva um sinal de autenticação
        const data = await response.json();
        localStorage.setItem('userName', data.name); // Salva o nome do usuário
        // Aguarda 2 segundos para mostrar o modal antes de redirecionar
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(error || 'Erro ao conectar. Tente novamente.');
      }
    } catch (error) {
      setError('Erro ao conectar. Tente novamente.');
    }
  }

  return (
    <>
      <div className='login-box'>
        <img src="/logo-white.png" alt="" width={120}/>
        <div className='login-box-content'>
          <div className='login-header'>
            <AccountCircleIcon style={{width: '25px', height: '25px'}}/>
            <h1>Login</h1>
          </div>
          <form className='login-form-container' onSubmit={VertisLogin}>
            <div className='login-container'>

              <div className='login-form'>
                <label htmlFor="user" className='login-label'>Usuário</label>
                <div className="input-with-icon">
                  <PersonOutlineIcon className="input-icon" />
                  <input
                    type="text"
                    name="user"
                    id="user"
                    className='login-input'
                    placeholder='Digite seu usuário..'
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className='login-form'>
                <label htmlFor="password" className='login-label'>Senha</label>
                <div className="input-with-icon password-input-wrapper">
                  <LockOutlinedIcon className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    className='login-input'
                    placeholder='Sua senha..'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </button>
                </div>
              </div>
            </div>
            <div className='login-options' style={{ display: 'flex', marginBottom: '2px', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #ccc', paddingTop: '20px'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" name="remember" id="remember" className='login-checkbox' />
                <label htmlFor="remember" className='login-remember-me'>Mantenha-me conectado(a)</label>
              </div>
              <div>
                <a href="#" className='login-forgot-password'>Esqueceu a senha?</a>
              </div>
            </div>
            {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '14px', textAlign: 'center', marginTop: '10px'}}>{error}</div>}
            <button type='submit' className='login-button'>
              <LoginIcon />
              Entrar
            </button>
          </form>
        </div>
      </div>

      {modalLogged && (
        <div className='logged-modal'>
          <div className='logged-content'>
            <div className='logged-header'>
              <h1>Login realizado!</h1>
            </div>
            <div className='logged-body'>
              <span>Em breve você será redirecionado para o sistema.</span>

              <div className="paw-animation-container">
                <div className="paw"></div>
                <div className="paw"></div>
                <div className="paw"></div>
                <div className="paw"></div>
                <div className="paw"></div>
                <div className="paw"></div>
                <div className="paw"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Login;