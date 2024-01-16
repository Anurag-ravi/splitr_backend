const User = require("../models/usermodel");
const { verifyOauthToken, generateToken } = require("../utilities/token");

const oauthLogin = async (req, res) => {
    const { token } = req.body;
    if(!token) return res.json({status:400, message:"OAuth token not found"});
    const data = await verifyOauthToken(token);
    if(!data.valid) return res.json({status:401, message:"Invalid OAuth token"});
    // token is verified
    const email = data.email;
    const user = await User.findOne({ email: email });
    var newUser;
    if(!user) {
        newUser = await User.create({
            email: email,
            verified: true
        });
        const newToken = generateToken(newUser);
        return res.json({status:200, token: newToken, registered_now:true});
    }
    const newToken = generateToken(user);
    return res.json({status:200, token: newToken, registered_now:false});
}

module.exports = {
    oauthLogin
}