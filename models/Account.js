// ✅ Define Account model with name 'Account'
const accountSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  });
  // ✅ Check if the model exists, if not, create it
const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);