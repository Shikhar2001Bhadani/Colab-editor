import mongoose from 'mongoose';

const collaboratorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['editor', 'viewer'], default: 'viewer' },
}, { _id: false });

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true, default: 'Untitled Document', trim: true },
  content: { type: Object, default: { ops: [] } }, // Quill Delta format
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [collaboratorSchema],
}, { timestamps: true });

const Document = mongoose.model('Document', DocumentSchema);
export default Document;