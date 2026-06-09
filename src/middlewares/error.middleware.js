const errorHandler = (err, req, res, next) => {
    // Agar error hamara ApIError hai
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors || []
        });
    }
    
    // Agar koi aur error hai (default)
    return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: []
    });
};

export { errorHandler };