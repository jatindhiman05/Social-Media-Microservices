const Post = require('../models/Post');
const logger = require('../utils/logger')

const createPost = async (req,res)=>{
    try {
        const { content, mediaIds } = req.body;

        const newPost = new Post.create({
            user : req.user.userId,
            content ,
            mediaIds : mediaIds || []
        })

        await newPost.save();
        logger.info('Post Created Successfully',newPost)
        res.status(201).json({
            success : true,
            message : 'Post Created Successfully'
        })
    } catch (error) {
        logger.error("Error Creating Post", error);
        res.status(500).json({
            success : false,
            message : "Error Creating Post"
        })
    }
}

const getAllPosts = async (req, res) => {
    try {

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

    } catch (error) {
        logger.error("Error deleting Post", error);
        res.status(500).json({
            success: false,
            message: "Error deleting"
        })
    }
}

module.exports = { createPost, getAllPosts, getPost, deletePost }