import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signToken } from '../auth/jwt.js';

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Look up user from MongoDB
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare provided password against the stored bcrypt hash
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: user._id, email: user.email, role: user.role });
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login' });
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password before storing
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Always register as 'user' — role is NEVER accepted from the client
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    const token = signToken({ id: user._id, email: user.email, role: user.role });
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during registration' });
  }
}

// ─── Get Current User (/me) ───────────────────────────────────────────────────
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, created_at: user.createdAt } });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching user' });
  }
}

// ─── Update Profile (/me/profile) ─────────────────────────────────────────────
export async function updateProfile(req, res) {
  const { name, email } = req.body;
  if (!name && !email) {
    return res.status(400).json({ message: 'Provide name or email to update' });
  }
  try {
    // Check email is not already taken by someone else
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existing) return res.status(409).json({ message: 'Email already in use by another account' });
    }
    const updates = {};
    if (name)  updates.name  = name.trim();
    if (email) updates.email = email.trim().toLowerCase();

    const updated = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    return res.json({
      message: 'Profile updated successfully',
      user: { id: updated._id, name: updated.name, email: updated.email, role: updated.role },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating profile' });
  }
}

// ─── Change Password (/me/password) ───────────────────────────────────────────
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  try {
    const user = await User.findById(req.user.id);
    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();
    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error changing password' });
  }
}
