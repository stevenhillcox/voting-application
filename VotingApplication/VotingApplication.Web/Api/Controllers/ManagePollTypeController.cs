﻿using System;
using System.Linq;
using System.Net;
using System.Web.Http;
using VotingApplication.Data.Context;
using VotingApplication.Data.Model;
using VotingApplication.Web.Api.Models.DBViewModels;

namespace VotingApplication.Web.Api.Controllers
{
    public class ManagePollTypeController : WebApiController
    {
        public ManagePollTypeController() : base() { }

        public ManagePollTypeController(IContextFactory contextFactory) : base(contextFactory) { }

        [HttpPut]
        public void Put(Guid manageId, ManagePollTypeRequest updateRequest)
        {
            using (var context = _contextFactory.CreateContext())
            {
                Poll poll = context.Polls.Where(p => p.ManageId == manageId).SingleOrDefault();

                if (poll == null)
                {
                    ThrowError(HttpStatusCode.NotFound, string.Format("Poll for manage id {0} not found", manageId));
                }

                if (!ModelState.IsValid)
                {
                    ThrowError(HttpStatusCode.BadRequest, ModelState);
                }

                poll.PollType = (PollType)Enum.Parse(typeof(PollType), updateRequest.PollType, true);
                poll.MaxPerVote = updateRequest.MaxPerVote;
                poll.MaxPoints = updateRequest.MaxPoints;

                poll.LastUpdated = DateTime.Now;

                context.SaveChanges();
            }
        }
    }
}
