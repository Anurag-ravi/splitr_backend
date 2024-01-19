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
            email: email
        });
        const newToken = generateToken(newUser);
        return res.json({status:200, token: newToken, registered_now:true,user:newUser});
    }
    const newToken = generateToken(user);
    return res.json({status:200, token: newToken, registered_now:!user.verified,user:user});
}

const oauthRegister = async (req, res) => {
    const { name, country_code, number, upi_id } = req.body;
    const user = req.user;
    if(!name ||!country_code ||!number ||!upi_id) return res.json({status:400, message:"Missing parameters"});
    user.name = name;
    user.country_code = country_code;
    user.phone = number;
    user.upi_id = upi_id;
    user.verified = true;
    await user.save();
    const token = generateToken(user);
    return res.json({status:200,user:user,token:token});
}

module.exports = {
    oauthLogin,
    oauthRegister
}