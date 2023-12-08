const Like = require("../models/likeModel");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const Comment = require("../models/commentModel");
const helper = require("../utils/helper");
const SubscriptionPlan = require("../models/subscriptionplanModel");

const io = require("../app");

const { Op } = require("sequelize");
const Collaboration = require("../models/collaborationModel");

class UserController {
  createPost = async (req, res, next) => {
    const userId = req.user.id;
    try {
      helper.validateRequest(req);

      const { title, description, editable, draft } = req.body;

      const user = await User.findOne({
        where: { id: userId },
        include: SubscriptionPlan,
      });

      console.log("User :::", user.subscriptionplan.posts_limit);

      const maxPostsLimit = user.subscriptionplan.posts_limit;
      const userPlan = user.subscriptionplan.plan_name;

      if (userPlan === "Basic") {
        const { count } = await Post.findAndCountAll({
          where: { userId },
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
          userId,
          createdAt: { [Op.between]: [monthStarting, monthEnding] },
        },
      });

      if (userPostCount.count >= maxPostsLimit) {
        const error = new Error("Maximum post limit for the month reached!");
        error.statusCode = 403;
        throw error;
      }

      const post = await user.createPost({
        title: title,
        description: description,
        editable: editable,
        draft: draft,
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
    const userId = req.user.id;
    const draft = req.query.draft || false;

    try {
      const posts = await Post.findAll({
        where: { userId, draft },
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
    const userId = req.user.id;
    try {
      helper.validateRequest(req);

      const postId = req.query.postId;
      const { title, description, editable } = req.body;

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

      post.title = title;
      post.description = description;
      post.editable = editable;

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
    const userId = req.user.id;

    try {
      helper.validateRequest(req);

      const postId = req.query.postId;

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

      await Comment.destroy({
        where: { postId },
      });

      await Like.destroy({
        where: { postId },
      });

      Collaboration.destroy({
        where: { postId },
      });

      res.status(200).json({ message: "Deleted Post.", data: result });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  searchPost = async (req, res, next) => {
    const userId = req.user.id;
    try {
      helper.validateRequest(req);

      const { searchItem, editable, sortBy, orderBy } = req.query;

      let whereCondition = {
        userId,
        draft: false,
      };

      if (searchItem) {
        whereCondition[Op.or] = [
          { title: { [Op.like]: `%${searchItem}%` } },
          { description: { [Op.like]: `%${searchItem}%` } },
        ];
      }

      if (editable) {
        whereCondition.editable = editable;
      }

      const order = sortBy ? [[sortBy, orderBy]] : [];

      const result = await Post.findAll({
        where: whereCondition,
        order,
      });

      if (result.length === 0) {
        const error = new Error("No result found!");
        error.statusCode = 202;
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
    const userId = req.user.id;
    try {
      helper.validateRequest(req);

      const postId = req.body.postId;

      const post = await Post.findByPk(postId);

      if (!post) {
        const error = new Error("No Result Found!");
        error.statusCode = 404;
        throw error;
      }
      const isLike = await Like.findOne({
        where: { postId, userId },
      });

      if (!isLike) {
        const like = await post.createLike({
          userId,
        });

        res
          .status(201)
          .json({ message: "Your like successfully updated.", data: like });
      } else {
        isLike.liked = !isLike.liked;
        const disLike = await isLike.save();
        res.status(200).json({
          message: isLike.liked
            ? "You liked a post again."
            : "Disliked Success",
          data: disLike,
        });
      }
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  getLikes = async (req, res, next) => {
    try {
      helper.validateRequest(req);

      const postId = req.query.postId;

      const post = await Post.findByPk(postId);

      if (!post) {
        const error = new Error("No Post available!");
        error.statusCode = 404;
        throw error;
      }

      const LikesData = await Like.findAndCountAll({
        where: {
          liked: true,
          postId,
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
    const userId = req.user.id;
    try {
      helper.validateRequest(req);

      const { postId, comment } = req.body;

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
        comment,
        userId,
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
    try {
      helper.validateRequest(req);

      const postId = req.query.postId;

      const post = await Post.findByPk(postId);

      if (!post) {
        const error = new Error("No Post available!");
        error.statusCode = 404;
        throw error;
      }

      const commentData = await Comment.findAndCountAll({
        where: { postId },
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
    const userId = req.user.id;
    try {
      helper.validateRequest(req);

      const commId = req.query.commId;

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
    const userId = req.user.id;
    try {
      helper.validateRequest(req);

      const { postId, collabId } = req.query;
      const content = req.body;

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
            userId,
            postId,
            status: false,
          },
        });

        if (!collabQuote) {
          const error = new Error("Collab Quote not found!");
          error.statusCode = 404;
          throw error;
        }

        collabQuote.collab_content = content;

        const updated = await collabQuote.save();

        res.status(200).json({ message: "Quote updated.", data: updated });
      } else {
        const user = await User.findOne({
          where: { id: userId },
          include: SubscriptionPlan,
        });

        const collabLimit = user.subscriptionplan.collab_limit;
        const userPlan = user.subscriptionplan.plan_name;

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
            userId,
            createdAt: { [Op.gte]: startOfDay },
          },
        });

        if (userCollabCount.count >= collabLimit) {
          const error = new Error("Collaboration limit reached for the day!");
          error.statusCode = 403;
          throw error;
        }

        const result = await post.createCollaboration({
          collab_content: content,
          userId,
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
    const userId = req.user.id;
    try {
      const { postId, isOwner, isCollabor } = req.query;
      const status = req.query.status || false;

      if (isOwner) {
        if (postId) {
          const post = await Post.findByPk(postId);

          if (!post) {
            const error = new Error("Post not Found!");
            error.statusCode = 404;
            throw error;
          }

          if (post.userId === userId) {
            const collabList = await Collaboration.findAll({
              where: { postId, status },
            });

            if (collabList.length === 0) {
              const error = new Error("No Collaboration found for this post!");
              error.statusCode = 404;
              throw error;
            }

            res.status(200).json({
              message: "Collaboration list found by postId.",
              data: collabList,
            });
          } else {
            const error = new Error("You are not eligible for this request!");
            error.statusCode = 403;
            throw error;
          }
        } else {
          const collabList = await Collaboration.findAll({
            where: { status },
            include: [{ model: Post, where: { userId }, attributes: [] }],
          });

          if (collabList.length === 0) {
            const error = new Error("No collab requests found!");
            error.statusCode = 404;
            throw error;
          }

          res
            .status(200)
            .json({ message: "Collab requests found.", data: collabList });
        }
      } else if (isCollabor) {
        if (postId) {
          const collabList = await Collaboration.findAll({
            where: { userId, postId, status },
          });

          if (collabList.length === 0) {
            const error = new Error("You have not collaborated yet!");
            error.statusCode = 404;
            throw error;
          }

          res.status(200).json({
            message: "Here your collaborated list by postId.",
            data: collabList,
          });
        } else {
          const collabList = await Collaboration.findAll({
            where: { userId, status },
          });

          if (collabList.length === 0) {
            const error = new Error("You have not collaborated yet!");
            error.statusCode = 404;
            throw error;
          }

          res.status(200).json({
            message: "Here your all collaborated list.",
            data: collabList,
          });
        }
      }
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  DeleteCollab = async (req, res, next) => {
    const userId = req.user.id;
    try {
      helper.validateRequest(req);

      const { postId, collabId } = req.query;

      const post = await Post.findByPk(postId);

      if (!post) {
        const error = new Error("Post not found!");
        error.statusCode = 404;
        throw error;
      }

      const collab = await Collaboration.findByPk(collabId);

      if (!collab) {
        const error = new Error("Collab not found!");
        error.statusCode = 404;
        throw error;
      }

      if (post.userId === userId) {
        const result = await collab.destroy();

        res.status(200).json({ message: "Collab Deleted.", data: result });
      } else if (collab.userId === userId) {
        const result = await collab.destroy();

        res.status(200).json({ message: "Collab Deleted.", data: result });
      } else {
        const error = new Error("You are not eligible person to delete!");
        error.statusCode = 401;
        throw error;
      }

      console.log(collab.post);
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  approveCollab = async (req, res, next) => {
    const userId = req.user.id;

    try {
      helper.validateRequest(req);

      const collabId = req.query.collabId;

      const collab = await Collaboration.findByPk(collabId);

      if (!collab) {
        const error = new Error("Collab not found!");
        error.statusCode = 404;
        throw error;
      }

      const post = await Post.findOne({ where: { id: collab.postId } });

      if (!post) {
        const error = new Error("Post not found!");
        error.statusCode = 404;
        throw error;
      }

      if (post.userId === userId) {
        post.description = collab.collab_content;
        collab.status = true;

        await collab.save();
        const result = await post.save();

        res
          .status(200)
          .json({ message: "Collab request approved.", data: result });
      } else {
        const error = new Error("You are not eligible person to approve!");
        error.statusCode = 401;
        throw error;
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
