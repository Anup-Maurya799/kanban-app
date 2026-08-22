import mongoose from "mongoose";

// Comment Schema
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

// Card Schema
const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: true,
    },

    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },

    position: {
      type: Number,
      required: true,
      default: 0,
    },

    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    dueDate: {
      type: Date,
      default: null,
    },

    labels: [
      {
        type: String,
      },
    ],

    comments: [commentSchema],
  },
  { timestamps: true },
);

const Card = mongoose.model("Card", cardSchema);

export default Card;
