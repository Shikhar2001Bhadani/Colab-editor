import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Heading, VStack, HStack, Text, useToast, SimpleGrid, Card, CardBody, CardHeader, IconButton,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure, Input
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { getDocuments, createDocument, deleteDocument as deleteDocApi } from '../api/documentApi';
import Loader from '../components/Loader';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDocName, setNewDocName] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const docs = await getDocuments();
        setDocuments(docs);
      } catch (error) {
        toast({ title: 'Failed to fetch documents', status: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [toast]);

  const handleCreateClick = () => {
    setNewDocName('');
    onOpen();
  };

  const handleCreateDocument = async () => {
    const trimmedName = newDocName.trim();
    if (!trimmedName) {
      toast({ title: 'Please enter a document name', status: 'warning' });
      return;
    }
    try {
      const newDoc = await createDocument({ title: trimmedName });
      onClose();
      navigate(`/documents/${newDoc._id}`);
    } catch (error) {
      toast({ title: 'Failed to create document', status: 'error' });
    }
  };

  const handleDeleteDocument = async (id, e) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    if (window.confirm('Are you sure you want to delete this document?')) {
        try {
            await deleteDocApi(id);
            setDocuments(documents.filter(doc => doc._id !== id));
            toast({ title: 'Document deleted', status: 'success' });
        } catch (error) {
            toast({ title: 'Failed to delete document', status: 'error' });
        }
    }
  };

  if (loading) return <Loader />;

  return (
    <Box p={8}>
      <HStack justifyContent="space-between" mb={8}>
        <Heading>My Documents</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleCreateClick}>
          New Document
        </Button>
      </HStack>
      {documents.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          {documents.map((doc) => (
            <Card 
              key={doc._id} 
              onClick={() => navigate(`/documents/${doc._id}`)} 
              cursor="pointer"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.2s"
            >
              <CardHeader>
                <HStack justifyContent="space-between">
                    <Heading size="md">{doc.title}</Heading>
                    <IconButton 
                        icon={<DeleteIcon />} 
                        size="sm"
                        colorScheme='red'
                        variant='ghost'
                        onClick={(e) => handleDeleteDocument(doc._id, e)}
                    />
                </HStack>
              </CardHeader>
              <CardBody>
                <Text>Owned by: {doc.owner.username}</Text>
                <Text fontSize="sm" color="gray.500">
                  Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
                </Text>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Text>No documents found. Create one to get started!</Text>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Name Your New Document</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Enter document name"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDocument()}
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateDocument}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Dashboard;