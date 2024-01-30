const createExpense = async (req,res) => {
    const {trip,name,amount,category,split_type,paid_by,paid_for} = req.body;
    console.log(trip,name,amount,category,split_type,paid_by,paid_for);
    res.json({status:200});
}

module.exports = {
    createExpense
}