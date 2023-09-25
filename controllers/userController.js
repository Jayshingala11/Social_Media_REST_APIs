const Like = require("../models/likeModel");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const Comment = require("../models/commentModel");
const helper = require("../utils/helper");

const { Op } = require("sequelize");

class UserController { 
  createPost = async (req, res, next) => {
    const body = req.body;
    const data = req.data;
    try {
      helper.validateRequest(req);

      const user = await User.findOne({ where: { id: data.id } });

      const post = await user.createPost({
        title: body.title,
        description: body.description,
        editable: body.editable,
        draft: body.draft,
      });

      res
        .status(201)
        .json({ message: "Post created Successfully.", data: post });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  getPosts = async (req, res, next) => {
    const userId = req.data.id;
    const draft = req.query.draft;

    try {
      const posts = await Post.findAll({ where: { userId: userId, draft: draft } });

      if (posts.length === 0) {
        const error = new Error("Could not find posts!");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({ message: "Posts Fetched.", data: posts });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  updatePost = async (req, res, next) => {
    const postId = req.query.postId;
    const userId = req.data.id;
    const body = req.body;
    try {
      helper.validateRequest(req);

      const post = await Post.findByPk(postId);

      if (!post) {
        const error = new Error("Could not find post!");
        error.statusCode = 404;
        throw error;
      }

      if (userId !== post.userId) {
        const error = new Error("Access Denied!");
        error.statusCode = 403;
        throw error;
      }

      post.title = body.title;
      post.description = body.description;
      post.editable = body.editable;

      const result = await post.save();

      res.status(200).json({ message: "Post Updated.", data: result });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  deletePost = async (req, res, next) => {
    const postId = req.query.postId;
    const userId = req.data.id;

    try {
      const post = await Post.findByPk(postId);

      if (!post) {
        const error = new Error("Could not find post!");
        error.statusCode = 404;
        throw error;
      }

      if (userId !== post.userId) {
        const error = new Error("Access Denied!");
        error.statusCode = 403;
        throw error;
      }

      const result = await post.destroy();

      const deleteComments = await Comment.destroy({
        where: { postId: postId },
      });

      const deleteLikes = await Like.destroy({
        where: { postId: postId },
      });

      res.status(200).json({ message: "Deleted Post.", data: result });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  searchItem = async (req, res, next) => {
    const searchItem = req.query.searchItem;
    const userId = req.data.id;
    try {
      const result = await Post.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${searchItem}%` } },
            { description: { [Op.like]: `%${searchItem}%` } },
          ],
          userId: userId,
        },
      });

      if (result.length === 0) {
        const error = new Error("No result found!");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({ message: "Result found.", data: result });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  sorting = async (req, res, next) => {
    const sortBy = req.query.sortBy;
    const orderBy = req.query.orderBy;
    const userId = req.data.id;

    try {
      const result = await Post.findAll({
        order: [[sortBy, orderBy]],
        where: { userId: userId },
      });

      if (result.length === 0) {
        const error = new Error("No Result Found!");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({ message: "Result found.", data: result });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  filter = async (req, res, next) => {
    const editable = req.query.editable;
    const userId = req.data.id;

    try {
      const result = await Post.findAll({
        where: { editable: editable, userId: userId },
      });

      if (result.length === 0) {
        const error = new Error("No Result Found!");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({ message: "Result found.", data: result });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  likesUpdate = async (req, res, next) => {
    const postId = req.body.postId;
    const userId = req.data.id;

    try {
      const post = await Post.findByPk(postId);

      if (!post) {
        const error = new Error("No Result Found!");
        error.statusCode = 404;
        throw error;
      }
      const isLike = await Like.findOne({
        where: { postId: postId, userId: userId },
      });

      if (!isLike) {
        const like = await post.createLike({
          userId: userId,
        });

        res
          .status(201)
          .json({ message: "Your like successfully updated.", data: like });
      } else if (isLike.liked === true) {
        isLike.liked = false;

        const disLike = await isLike.save();

        res.status(200).json({ message: "Disliked Success", data: disLike });
      } else if (isLike.liked === false) {
        isLike.liked = true;

        const disLike = await isLike.save();

        res
          .status(200)
          .json({ message: "You liked a post again.", data: disLike });
      }
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  getLikes = async (req, res, next) => {
    const postId = req.query.postId;

    try {
      const post = await Post.findByPk(postId);

      if (!post) {
        const error = new Error("No Post available!");
        error.statusCode = 404;
        throw error;
      }

      const LikesData = await Like.findAndCountAll({
        where: {
          liked: true,
          postId: postId,
        },
      });

      if (LikesData.count === 0 && LikesData.rows.length === 0) {
        const error = new Error("No Likes Found!");
        error.statusCode = 404;
        throw error;
      }

      res
        .status(200)
        .json({ message: "Likes Fatched Successfully.", data: LikesData });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  postComment = async (req, res, next) => {
    const postId = req.body.postId;
    const userId = req.data.id;
    const comment = req.body.comment;

    try {
      const post = await Post.findOne({
        where: { id: postId },
        include: { model: Comment },
      });

      if (!post) {
        const error = new Error("No Post available!");
        error.statusCode = 404;
        throw error;
      }

      const data = await post.createComment({
        comment: comment,
        userId: userId,
      });

      res.status(201).json({ message: "Comment created.", data: data });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  getComment = async (req, res, next) => {
    const postId = req.query.postId;

    try {
      const post = await Post.findByPk(postId);

      if (!post) {
        const error = new Error("No Post available!");
        error.statusCode = 404;
        throw error;
      }

      const commentData = await Comment.findAndCountAll({
        where: { postId: postId },
      });

      if (commentData.count === 0 && commentData.rows.length === 0) {
        const error = new Error("No Comments Found!");
        error.statusCode = 404;
        throw error;
      }

      res
        .status(200)
        .json({ message: "Comments Fatched Successfully.", data: commentData });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  deleteComment = async (req, res, next) => {
    const commId = req.query.commId;
    const userId = req.data.id;

    try {
      const comment = await Comment.findByPk(commId);

      if (!comment) {
        const error = new Error("No Comment Found!");
        error.statusCode = 404;
        throw error;
      }

      if (comment.userId !== userId) {
        const error = new Error("Access Denied!");
        error.statusCode = 403;
        throw error;
      }

      const result = await comment.destroy();

      res.status(200).json({ message: "Comment Deleted.", data: result });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };
}

module.exports = new UserController();
