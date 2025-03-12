// user registration
const logger = require('../utils/logger');
const User = require('../models/User')
const {validateRegistration, validateLogin} = require('../utils/validation');
const generateToken = require('../utils/generateToken');

const registerUser = async (req,res)=>{
    logger.info('Registration endpoint hit...')
    try {
        // validate the schema
        const {error} = validateRegistration(req.body)
        if(error){
            logger.warn('Validation error',error.details[0].message)
            return res.status(400).json({
                success : false,
                message: error.details[0].message,
            })
        }

        const {email,password,username} = req.body

        let user = await User.findOne({$or : [{email},{username}]});
        if(user){
            logger.warn('User already exists');
            return res.status(400).json({
                success: false,
                message: 'User already exists',
            })
        }

        user = new User({username,email,password})
        await user.save()
        logger.warn('User saved successfully',user._id);

        const {accessToken, refreshToken} = await generateToken(user) 

        res.status(201).json({
            success : true,
            message : 'User registered successfully!',
            accessToken,
            refreshToken
        })
    } catch (error) {
        logger.error('Registration error occured ')
        res.status(500).json({
            success : false,
            message : "Internal Server Error"
        })
    }
}
// user login
const loginUser = async (req, res) => {
    logger.info("Login endpoint hit...");
    try {
        // Validate request body
        const { error } = validateLogin(req.body);
        if (error) {
            logger.warn('Validation error:', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            logger.warn('Login failed: User not found');
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Validate password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            logger.warn('Login failed: Incorrect password');
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = await generateToken(user);

        logger.info(`User logged in successfully: ${user._id}`);

        res.json({
            success: true,
            message: 'Login successfull',
            accessToken,
            refreshToken,
            userId: user._id
        });

    } catch (error) {
        logger.error('Login error occurred:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


module.exports = { registerUser, loginUser };