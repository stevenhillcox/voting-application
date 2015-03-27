﻿using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web.Http;
using VotingApplication.Data.Context;
using VotingApplication.Data.Model;
using VotingApplication.Web.Api.Models.DBViewModels;

namespace VotingApplication.Web.Api.Controllers.API_Controllers
{
    public class ManageVoteController : WebApiController
    {
        public ManageVoteController()
        {
        }

        public ManageVoteController(IContextFactory contextFactory)
            : base(contextFactory)
        {
        }

        [HttpGet]
        public List<ManageVoteResponseModel> Get(Guid manageId)
        {
            using (var context = _contextFactory.CreateContext())
            {
                Poll poll = context
                    .Polls
                    .Include(p => p.Ballots)
                    .Include(p => p.Ballots.Select(b => b.Votes))
                    .Include(p => p.Ballots.Select(b => b.Votes.Select(v => v.Option)))
                    .SingleOrDefault(s => s.ManageId == manageId);

                if (poll == null)
                {
                    string errorMessage = String.Format("Poll {0} not found", manageId);
                    this.ThrowError(HttpStatusCode.NotFound, errorMessage);
                }

                if (poll.Ballots.Any())
                {
                    List<ManageVoteResponseModel> response = poll
                        .Ballots
                        .Where(b => b.Votes.Any())
                        .Select(CreateManageVoteResponse)
                        .ToList();

                    return response;
                }

                return new List<ManageVoteResponseModel>(0);
            }
        }

        private static ManageVoteResponseModel CreateManageVoteResponse(Ballot ballot)
        {
            var model = new ManageVoteResponseModel
            {
                VoterName = ballot.VoterName,
                Votes = new List<VoteResponse>()
            };

            foreach (Vote vote in ballot.Votes)
            {
                var voteResponse = new VoteResponse
                {
                    Value = vote.VoteValue,
                    OptionName = vote.Option.Name
                };
                model.Votes.Add(voteResponse);
            }

            return model;
        }

        [HttpDelete]
        public void Delete(Guid manageId)
        {
            using (IVotingContext context = _contextFactory.CreateContext())
            {
                Poll poll = context
                    .Polls
                    .FirstOrDefault(s => s.ManageId == manageId);

                if (poll == null)
                {
                    this.ThrowError(HttpStatusCode.NotFound, string.Format("Poll {0} not found", manageId));
                }

                foreach (Ballot ballot in poll.Ballots.ToList())
                {
                    foreach (Vote vote in ballot.Votes.ToList())
                    {
                        context.Votes.Remove(vote);
                    }

                    ballot.Votes.Clear();
                    context.Ballots.Remove(ballot);
                }

                poll.Ballots.Clear();
                poll.LastUpdated = DateTime.Now;

                context.SaveChanges();
            }
        }

        [HttpDelete]
        public void Delete(Guid manageId, long voteId)
        {
            using (var context = _contextFactory.CreateContext())
            {
                Poll matchingPoll = context.Polls.FirstOrDefault(s => s.ManageId == manageId);
                if (matchingPoll == null)
                {
                    this.ThrowError(HttpStatusCode.NotFound, string.Format("Poll {0} not found", manageId));
                }

                Vote matchingVote = context
                    .Votes
                    .Include(v => v.Poll)
                    .FirstOrDefault(v => v.Id == voteId && v.Poll.UUID == matchingPoll.UUID);

                context.Votes.Remove(matchingVote);

                matchingPoll.LastUpdated = DateTime.Now;
                context.SaveChanges();
            }
        }
    }
}