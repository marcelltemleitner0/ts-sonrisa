import { Router } from "express";

const router = Router();


router.get("/register",(req,res)=>{
    res.render("register");
});


router.get("/reservation",(req,res)=>{
    res.render("reservation");
});


export default router;
