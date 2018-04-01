function verifyToken(req, res, next) {
    //get auth header value
    const bearerHeader = req.headers['authorization'];
    //check if bearer is undefined
    if (typeof bearerHeader !== 'undefined') {
        //split at space
        //FORMAT OF TOKEN authorization: Bearer <access_token>
        const bearerToken = bearerHeader.split(' ')[1];
        //set token
        req.token = bearerToken;
        //next middleware
        next();
    } else {
        //forbidden
        res.sendStatus(403);
    }
}

module.exports = {
    verifyToken
};