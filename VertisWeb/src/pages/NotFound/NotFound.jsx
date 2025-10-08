import { useState, useEffect } from 'react'
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
            <h1 className='error-desc'>Opss.., essa página não existe.</h1>
          </div>
      </section>

      
    </>
  )
}

export default NotFound;
