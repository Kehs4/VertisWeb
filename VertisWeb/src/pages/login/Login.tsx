import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        localStorage.setItem('isAuthenticated', 'true'); // Salva um sinal de autenticação
        const data = await response.json();
        localStorage.setItem('userName', data.name); // Salva o nome do usuário
        navigate('/dashboard');
      } else {
        setError('Usuário ou senha incorretos.');
      }
    } catch (error) {
      setError('Erro ao conectar. Tente novamente.');
    }
  }

  return (
    <>
      <div className='login-box'>
        <img src="/logo-white.png" alt="" width={200}/>
        <div className='login-box-content'>
          <div className='login-header'>
            <AccountCircleIcon style={{width: '25px', height: '25px'}}/>
            <h1>Login</h1>
          </div>
          <form className='login-form-container' onSubmit={VertisLogin}>
            <div className='login-container'>


              <div className='login-form'>
                <label htmlFor="user" className='login-label'>Usuário</label>
                <input
                  type="text"
                  name="user"
                  id="user"
                  className='login-input'
                  placeholder='Usuário'
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>

              <div className='login-form' style={{ position: 'relative' }}>
                <label htmlFor="password" className='login-label'>Senha</label>
                <div className='login-password-container' style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    className='login-input'
                    placeholder='Senha'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      marginLeft: '-30px',
                      cursor: 'pointer',
                      color: 'white',
                      position: 'relative',
                      zIndex: 2
                    }}
                  >
                    {showPassword ? <VisibilityIcon className='login-password-icon' style={{ width: '18px', height: '18px', top: '-14px', position: 'absolute', right: '-15px', color: 'black', cursor: 'pointer' }} />
                      : <VisibilityOffIcon className='login-password-icon' style={{ width: '18px', height: '18px', top: '-14px', position: 'absolute', right: '-15px', color: 'black', cursor: 'pointer' }} />}
                  </span>
                </div>
              </div>
            </div>
            <div className='login-options' style={{ display: 'flex', marginBottom: '2px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" name="remember" id="remember" className='login-checkbox' />
                <label htmlFor="remember" className='login-remember-me'>Manter-me conectado</label>
              </div>
              <div>
                <a href="#" className='login-forgot-password'>Esqueci minha senha</a>
              </div>
            </div>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            <button type='submit' className='login-button'>Entrar</button>
          </form>
        </div>
      </div>
    </>
  )
}

export default Login;