import React from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';

const Loader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
    <Spinner size="xl" />
    <Text ml={4}>Loading...</Text>
  </Box>
);

export default Loader;