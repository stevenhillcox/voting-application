﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace VotingApplication.Web.Controllers
{
    public class PollController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }
    }
}