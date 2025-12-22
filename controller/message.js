const express = require("express");
const router = express.Router();
const Messages = require("../model/messages");
const ErrorHandler = require("../utils/ErrorHandler");
const cloudinary = require("cloudinary");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

/* CREATE NEW MESSAGE */
router.post(
  "/create-new-message",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { sender, text, conversationId, images } = req.body;

      let imageData = null;

      if (images) {
        const uploadRes = await cloudinary.v2.uploader.upload(images, {
          folder: "messages",
        });

        imageData = {
          public_id: uploadRes.public_id,
          url: uploadRes.secure_url,
        };
      }

      const message = await Messages.create({
        sender,
        text,
        conversationId,
        images: imageData,
      });

      res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

/* GET ALL MESSAGES */
router.get(
  "/get-all-messages/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const messages = await Messages.find({
        conversationId: req.params.id,
      });

      res.status(200).json({
        success: true,
        messages,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
