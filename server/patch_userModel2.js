const fs = require('fs');
const filePath = 'c:/Projects/TheBoxSync/server/models/userModel.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the pre-save hook manually by finding the indices
const startIndex = content.indexOf('userSchema.pre("save", async function (next) {');
if (startIndex !== -1) {
  const endIndex = content.indexOf('});', startIndex) + 3;
  
  const newHook = `userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
    user.passwordChangedAt = new Date(Date.now() - 1000);
    next();
  } catch (error) {
    next(error);
  }
});`;

  content = content.substring(0, startIndex) + newHook + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched pre-save hook.');
} else {
  console.log('Could not find pre-save hook.');
}
