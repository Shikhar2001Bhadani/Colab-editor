import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Button, Link, Spacer } from '@chakra-ui/react';
import useAuth from '../hooks/useAuth';
import { logout as logoutApi } from '../api/authApi';

const Header = () => {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutApi();
    logout();
    navigate('/login');
  };

  return (
    <Flex as="header" align="center" justify="space-between" wrap="wrap" padding="1.5rem" bg="blue.500" color="white">
      <Flex align="center" mr={5}>
        <Heading as="h1" size="lg" letterSpacing={'-.1rem'}>
          <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
            WorkRadius Docs
          </Link>
        </Heading>
      </Flex>
      <Spacer />
      <Box>
        {userInfo ? (
          <>
            <Button as={RouterLink} to="/" variant="ghost" mr={4}>
              Dashboard
            </Button>
            <Button onClick={handleLogout} colorScheme="red">
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button as={RouterLink} to="/login" variant="ghost" mr={4}>
              Login
            </Button>
            <Button as={RouterLink} to="/register" variant="outline">
              Register
            </Button>
          </>
        )}
      </Box>
    </Flex>
  );
};

export default Header;