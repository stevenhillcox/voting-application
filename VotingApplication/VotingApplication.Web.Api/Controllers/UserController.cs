﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using VotingApplication.Data;
using VotingApplication.Data.Context;
using VotingApplication.Data.Model;

namespace VotingApplication.Web.Api.Controllers
{
    public class UserController : WebApiController
    {
        public UserController() : base() { }
        public UserController(IContextFactory contextFactory) : base(contextFactory) { }

        #region Get
        public override HttpResponseMessage Get()
        {
            using (var context = _contextFactory.CreateContext())
            {
                return this.Request.CreateResponse(HttpStatusCode.OK, context.Users.ToList<User>());
            }
        }

        public override HttpResponseMessage Get(long id)
        {
            using (var context = _contextFactory.CreateContext())
            {
                User userForId = context.Users.Where(u => u.Id == id).FirstOrDefault();
                if (userForId == null)
                {
                    return this.Request.CreateErrorResponse(HttpStatusCode.NotFound, string.Format("User {0} not found", id));
                }
                else
                {
                    return this.Request.CreateResponse(HttpStatusCode.OK, userForId);
                }
            }
        } 
        #endregion 

        #region Post

        public HttpResponseMessage Post(User newUser)
        {
            using (var context = _contextFactory.CreateContext())
            {
                if (newUser.Name == null || newUser.Name.Equals(""))
                {
                    return this.Request.CreateErrorResponse(HttpStatusCode.Forbidden, "Must provide a Username");
                }

                if (context.Users.Where(u => u.Name == newUser.Name).Count() != 0)
                {
                    return this.Request.CreateErrorResponse(HttpStatusCode.Forbidden, String.Format("Username {0} is taken", newUser.Name));
                }

                context.Users.Add(newUser);
                context.SaveChanges();
                return this.Request.CreateResponse(HttpStatusCode.OK, newUser.Id);
            }
        }

        #endregion
    }
}