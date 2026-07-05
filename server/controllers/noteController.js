const SharedNote = require('../models/SharedNote');

const getNote = async (req, res) => {
  try {
    const { chatId } = req.params;
    let note = await SharedNote.findOne({ chatId });
    if (!note) {
      note = await SharedNote.create({ chatId, participants: [req.user._id] });
    }
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateNote = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, title } = req.body;
    const note = await SharedNote.findOneAndUpdate(
      { chatId },
      { content, title, lastEditedBy: req.user._id, $inc: { version: 1 } },
      { new: true, upsert: true }
    );
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNote, updateNote };