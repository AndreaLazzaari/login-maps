import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
// import NavDropdown from 'react-bootstrap/NavDropdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';

const MyNavbar: React.FC = () => {
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        navigate('/login')
    }


    return (
        <Navbar expand="lg" className="bg-info h-5">
            <Container>
                <Navbar.Brand href="#home" className='text-white'>Digitality Consulting</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="#home" className='text-white'>Home</Nav.Link>
                        <Nav.Link href="#link" className='text-white'>Link</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
                <Button variant="outline-primary" onClick={handleClick}>Login</Button>{' '}
            </Container>
        </Navbar>
    );
}

export default MyNavbar;