const Like = require("../models/likeModel");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const Comment = require("../models/commentModel");
const helper = require("../utils/helper");
const Subscription = require("../models/subscriptionModel");

const { Op } = require("sequelize");
const Collaboration = require("../models/collaborationModel");

class UserController {
  createPost = async (req, res, next) => {
    const body = req.body;
    const data = req.data;
    try {
      helper.validateRequest(req);

      const user = await User.findOne({
        where: { id: data.id },
        include: Subscription,
      });

      const maxPostsLimit = user.subscription.posts_limit;
      const userPlan = user.subscription.plan_name;

      if (userPlan === "Basic") {
        const { count } = await Post.findAndCountAll({
          where: { userId: data.id },
        });

        if (count >= maxPostsLimit) {
          const error = new Error(
            "Try our Standard or Premium plan to create more then 5 Posts!"
          );
          error.statusCode = 403;
          throw error;
        }
      }

      const today = new Date();
      const monthStarting = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnding = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      );

      const userPostCount = await Post.findAndCountAll({
        where: {
          userId: data.id,
          createdAt: { [Op.between]: [monthStarting, monthEnding] },
        },
      });

      if (userPostCount.count >= maxPostsLimit) {
        const error = new Error("Maximum post limit for the month reached!");
        error.statusCode = 403;
        throw error;
      }

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
    const draft = req.query.draft || false;

    try {
      const posts = await Post.findAll({
        where: { userId: userId, draft: draft },
      });

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
      helper.validateRequest(req);

      const result = await Post.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${searchItem}%` } },
            { description: { [Op.like]: `%${searchItem}%` } },
          ],
          userId: userId,
          draft: false,
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
      helper.validateRequest(req);

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
      helper.validateRequest(req);

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
      helper.validateRequest(req);

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
      helper.validateRequest(req);

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
      helper.validateRequest(req);

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
      helper.validateRequest(req);

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
      helper.validateRequest(req);

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

  postCollaboration = async (req, res, next) => {
    const userId = req.data.id;
    const postId = req.query.postId;
    const body = req.body;
    const collabId = req.query.collabId;

    try {
      helper.validateRequest(req);

      const post = await Post.findOne({
        where: { id: postId, editable: true, userId: { [Op.ne]: userId } },
      });

      if (!post) {
        const error = new Error("Post not Found!");
        error.statusCode = 404;
        throw error;
      }

      if (collabId) {
        const collabQuote = await Collaboration.findOne({
          where: {
            id: collabId,
            userId: userId,
            postId: postId,
            status: false,
          },
        });

        if (!collabQuote) {
          const error = new Error("Collab Quote not found!");
          error.statusCode = 404;
          throw error;
        }

        collabQuote.collab_content = body.content;

        const updated = await collabQuote.save();

        res.status(200).json({ message: "Quote updated.", data: updated });
      } else {
        const user = await User.findOne({
          where: { id: userId },
          include: Subscription,
        });

        const collabLimit = user.subscription.collab_limit;
        const userPlan = user.subscription.plan_name;

        if (userPlan === "Basic") {
          const error = new Error(
            "Try our Standard or Premium plan for collab with others post."
          );
          error.statusCode = 403;
          throw error;
        }

        const currentDate = new Date();
        const startOfDay = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          0,
          0,
          0
        );
        const userCollabCount = await Collaboration.findAndCountAll({
          where: {
            userId: userId, 
            createdAt: { [Op.gte]: startOfDay }, 
          }, 
        }); 
 
        if (userCollabCount.count >= collabLimit) {
          const error = new Error("Collaboration limit reached for the day!");
          error.statusCode = 403;
          throw error;
        }

        const result = await post.createCollaboration({
          collab_content: body.content,
          userId: userId,
        });

        res.status(200).json({
          message: "Collaboration request sent successfully.",
          data: result,
        });
      }
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  getCollabQuotes = async (req, res, next) => {
    const userId = req.data.id;
    const postId = req.query.postId;
    const status = req.query.status || false;

    try {
      if (postId) {
        const collabList = await Collaboration.findAll({
          where: { postId: postId, status: status},
        });

        if (collabList.length === 0) {
          const error = new Error("No Collaboration found!");
          error.statusCode = 404;
          throw error;
        }

        res
          .status(200)
          .json({ message: "Collaboration list found by postId.", data: collabList });
      } else {
        const collabList = await Collaboration.findAll({
          where: { userId: userId, status: status },
        });

        if (collabList.length === 0) {
          const error = new Error("No Collaboration found!");
          error.statusCode = 404;
          throw error;
        }

        res
          .status(200)
          .json({ message: "Collaboration list found by user.", data: collabList });
      }
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };
}

module.exports = new UserController();
