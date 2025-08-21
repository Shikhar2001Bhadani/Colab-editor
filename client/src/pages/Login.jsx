import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, Heading, useToast, Link, Text
} from '@chakra-ui/react';
import { login as loginApi } from '../api/authApi';
import useAuth from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await loginApi({ email, password });
      login(userData);
      navigate('/');
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.message || 'An error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minH="calc(100vh - 80px)">
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white">
        <VStack as="form" onSubmit={handleSubmit} spacing={4}>
          <Heading>Login</Heading>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormControl>
          <Button type="submit" colorScheme="blue" width="full">Login</Button>
          <Text>
            New user?{' '}
            <Link as={RouterLink} to="/register" color="blue.500">
              Register here
            </Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default Login;