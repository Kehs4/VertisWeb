import React, { useEffect } from 'react'
import './NotFound.css'
import ErrorIcon from '@mui/icons-material/Error';

function NotFound() {
useEffect (() => {
    document.title = "Vertis | Página não encontrada"
}, []);

  return (
    <>
      <section className='section-notfound'>
          <div>
            <ErrorIcon/>
            <h1 className='error-404'>Erro 404</h1>
            <h1 className='error-desc'>Opss..., essa página não existe.</h1>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
              <a href="/" className="notfound-link" style={{ color: "#888888", fontWeight: 600, margin: 4 }}>
                Voltar para a página inicial
              </a>

              <a href="/login" className="notfound-link" style={{ color: "#888888", fontWeight: 600, margin: 4 }}>
                Ir para tela de login
              </a>

            </div>
          </div>
      </section>

      
    </>
  )
}

export default NotFound;
