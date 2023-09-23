const {ObjectId} = require('mongodb');
const express = require('express');
const router = express.Router();

//include auth fn
const {ensureAuthenticated} = require('../config/auth');

//include model
const LawyerDetails = require('../models/JudgeDetails');
const CaseDetails = require('../models/CaseDetails');
const User = require('../models/User');

//dashboard
router.get
(
    '/dashboard',
    ensureAuthenticated,
    async (req, res) =>
    {
        if(req.user.is_profile_complete === "N")
            res.redirect('/judge/profile');
        else
            await CaseDetails.find
            (
                {
                    judge_id: ObjectId(req.user.id)
                }
            ).then
            (
                (cases) =>
                {
                    res.render('judge_dashboard', {f_name: req.user.fname, cases});
                }
            ).catch
            (
                (err) => console.log(err)
            );        
    }
);

//profile
router.get
(
    '/profile',
    ensureAuthenticated,
    (req, res) =>
    {
        res.render('judge_profile', {f_name: req.user.fname});
    }
);
router.post
(
    '/profile',
    ensureAuthenticated,
    async (req, res) =>
    {
        //comma separated preferred case types to arr
        const pref_case_types = req.body.pref_case_types;
        const pref_case_types_arr = pref_case_types.split(",");
        pref_case_types_arr.forEach((case_type) => case_type = case_type.trim());
        
        const new_judge_details = new LawyerDetails
        (
            {
                judge_id: req.user._id,
                bar_council_id: req.body.bar_id,
                company_name: req.body.company_name,
                pref_case_types: pref_case_types_arr,
                exp_yrs: req.body.exp_yrs,
                experience: req.body.exp,
                fees: req.body.fees,
                fee_descp: req.body.fee_descp,
                dob: req.body.dob,
                age: req.body.age,
                ph_no: req.body.ph_no
            }
        );

        await new_judge_details.save().then
        (
            async (new_judge_obj) =>
            {
                await User.updateOne
                (
                    {
                        _id: req.user._id
                    },
                    {
                        $set: {
                            is_profile_complete: "Y"
                        }
                    }
                ).then
                (
                    res.redirect('/judge/dashboard')
                ).catch
                (
                    (err) => console.log(err)
                );
            }
        ).catch
        (
            (err) => console.log(err)
        );
    }
);

//display profile
router.get
(
    '/display_judge_profile/:judge_id',
    ensureAuthenticated,
    async (req, res) =>
    {
        await LawyerDetails.find
        (
            {
                judge_id: ObjectId(req.params.judge_id)
            }
        ).then
        (
            async (judge_details) =>
            {
                await User.find
                (
                    {
                        _id: ObjectId(req.params.judge_id)
                    }
                ).then
                (
                    (judge_bio) =>
                    {
                        const {fname, mname, lname, email} = judge_bio[0];
                        const {company_name, pref_case_types, exp_yrs, experience, fees, fee_descp, dob, age, ph_no} = judge_details[0];

                        res.render('display_judge_profile', {fname, mname, lname, email, company_name, pref_case_types, exp_yrs, experience, fees, fee_descp, dob, age, ph_no});
                    }
                ).catch
                (
                    (err) => console.log(err)
                );
            }
        ).catch
        (
            (err) => console.log(err)
        ); 
    }
);


module.exports = router;