import tick from '../assets/tick.png'
import { useNavigate } from 'react-router-dom';

function Susscess() {

  const navigate = useNavigate()
  
  setTimeout(() => {
    navigate('/myorders')
  }, 2000);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      textAlign: 'center',
      backgroundColor: '#f9f9f9',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',       
      
    }}>
       <img src={tick} alt="" style={{
        width: '150px', height: '150px', marginBottom: '-50px' 
       }} />
      <h1 style={{
         fontSize: '46px', color: '#28a745', fontWeight: '600'
      }}>
        Order Successful</h1>
      
      </div>
  )
}

export default Susscess