const Post = require('../models/Post');
const logger = require('../utils/logger');
const { validateCreatePost } = require('../utils/validation');

async function invalidatePostCache(req,input){
    const cacheKey = `poat:${input}`
    await req.redisClient.del(cacheKey);
    const keys = await req.redisClient.keys('posts:*');
    if(keys.length > 0){
        await req.redisClient.del(keys);
    }
}

const createPost = async (req, res) => {
    logger.info('Create Post Endpoint hit ..')
    try {
        // validate the schema
        const { error } = validateCreatePost(req.body)
        if (error) {
            logger.warn('Validation error', error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            })
        }
        const { content, mediaIds } = req.body;

        const newPost = await Post.create({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || []
        })

        await newPost.save();
        await invalidatePostCache(req,newPost._id.toString());

        logger.info('Post Created Successfully', newPost)
        res.status(201).json({
            success: true,
            message: 'Post Created Successfully'
        })
    } catch (error) {
        logger.error("Error Creating Post", error);
        res.status(500).json({
            success: false,
            message: "Error Creating Post"
        })
    }
}

const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);

        if (cachedPosts) {
            return res.json(JSON.parse(cachedPosts))
        }

        const posts = await Post.find({}).sort({ createdAt: -1 }).skip(startIndex).limit(limit);

        const totalNoofPosts = await Post.countDocuments();

        const result = {
            posts,
            currentpage : true,
            totalPages: Math.ceil(totalNoofPosts/limit),
            totalPosts : totalNoofPosts
        }

        // save your posts in redis cache
        await req.redisClient.setex(cacheKey,300,JSON.stringify(result));

        res.json(result);
    } catch (error) {
        logger.error("Error Fetching Posts", error);
        res.status(500).json({
            success: false,
            message: "Error Fetching Posts"
        })
    }
}

const getPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const cacheKey = `poar:${postId}`;

        const cachedPost = await req.redisClient.get(cacheKey);

        if (cachedPost) {
            return res.json(JSON.parse(cachedPost))
        }

        const singlePostDetailsbyID = await Post.findById(postId);

        if(!singlePostDetailsbyID){
            return res.status(404).json({
                message : 'Post not found',
                success :false
            })
        }

        await req.redisClient.setex(cachedPost,3600,JSON.stringify(singlePostDetailsbyID))

        res.json(singlePostDetailsbyID)
    } catch (error) {
        logger.error("Error Fetching Post", error);
        res.status(500).json({
            success: false,
            message: "Error Fetching Post By ID"
        })
    }
}

const deletePost = async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({
            _id : req.params.id,
            user : req.user.userId
        })
        if (!post) {
            return res.status(404).json({
                message: 'Post not found',
                success: false
            })
        }

        await invalidatePostCache(req,req.params.id);
        res.json({
            message : 'Post deleted Successfully'
        })
    } catch (error) {
        logger.error("Error deleting Post", error);
        res.status(500).json({
            success: false,
            message: "Error deleting"
        })
    }
}

module.exports = { createPost, getAllPosts, getPost, deletePost }