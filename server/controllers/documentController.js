import asyncHandler from 'express-async-handler';
import Document from '../models/Document.js';

// @desc    Get all documents for any logged-in user
// @route   GET /api/documents
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
  // Fetch all documents, regardless of owner
  const documents = await Document.find({}).populate('owner', 'username');
  res.json(documents);
});

// @desc    Create a new document
// @route   POST /api/documents
// @access  Private
const createDocument = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const document = new Document({
    title: title || 'Untitled Document',
    owner: req.user._id, // Still track the original creator
    content: { ops: [{ insert: '\n' }] },
  });
  const createdDocument = await document.save();
  res.status(201).json(createdDocument);
});

// @desc    Get a single document by ID
// @route   GET /api/documents/:id
// @access  Private
const getDocumentById = asyncHandler(async (req, res) => {
  // Any logged-in user can get any document
  const document = await Document.findById(req.params.id).populate('owner', 'username');
  
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  
  res.json(document);
});

// @desc    Update a document's title
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = asyncHandler(async (req, res) => {
    const { title } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
        res.status(404);
        throw new Error('Document not found');
    }

    // Any logged-in user can change the title
    document.title = title || document.title;
    const updatedDocument = await document.save();
    res.json(updatedDocument);
});

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  // Any logged-in user can delete a document
  await document.deleteOne();
  res.json({ message: 'Document removed' });
});

export { getDocuments, createDocument, getDocumentById, updateDocument, deleteDocument };