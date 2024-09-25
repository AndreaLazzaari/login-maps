import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
// import NavDropdown from 'react-bootstrap/NavDropdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const MyNavbar: React.FC = () => {
    const auth = useAuth();
    const isLoggedIn = auth.isLoggedIn;
    const logout = auth.logout;
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (isLoggedIn) {
            logout();
            console.log('sei disconnesso');
            navigate('/login')
        } else {
            navigate('/login')
        }
    }

    const handleHome = (e: React.MouseEvent<HTMLLinkElement>) => {
        e.preventDefault();
        navigate('/')
    }




    return (
        <Navbar expand="lg" className="bg-info h-5">
            <Container>
                <Navbar.Brand href="#home" className='text-white'>Digitality Consulting</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="#home" className='text-white' onClick={handleHome}>Home</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
                <Button variant="outline-primary text-white" onClick={handleClick}>{isLoggedIn ? 'Logout' : 'Login'}</Button>{' '}
            </Container>
        </Navbar>
    );
}

export default MyNavbar;