const { z } = require('zod');

const registerSchema = z.object({
  firstName: z.string({ required_error: 'First name is required' }).min(2, 'First name is required'),
  lastName: z.string({ required_error: 'Last name is required' }).min(2, 'Last name is required'),
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
  password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters').max(100, 'Password too long')
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required')
});


module.exports = { registerSchema,loginSchema };