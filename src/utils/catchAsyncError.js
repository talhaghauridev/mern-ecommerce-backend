const catchAsyncError = (theFu) => (req, res, next) => {
   Promise.resolve(theFu(req, res, next)).catch(next);
};

export default catchAsyncError;
