﻿using Ninject;
using System.Web.Http;
using VotingApplication.Data.Context;
using VotingApplication.Web.Api.Controllers.API_Controllers;
using VotingApplication.Web.Common;

namespace VotingApplication.Web.Api.App_Start
{
    public class NinjectConfigurator
    {
        public void Configure(IKernel container)
        {
            // Add all bindings/dependencies
            AddBindings(container);

            // Use the container and our NinjectDependencyResolver as
            // application's resolver
            var resolver = new NinjectDependencyResolver(container);
            GlobalConfiguration.Configuration.DependencyResolver = resolver;

            // We also need a resolver for SignalR
            SignalRResolver = new NinjectSignalRDependencyResolver(container);
        }

        private void AddBindings(IKernel container)
        {
            //Do Bindings here
            container.Bind<IContextFactory>().To<ContextFactory>();
            container.Bind<IVotingContext>().To<VotingContext>();
            container.Bind<IMailSender>().To<MailSender>();
        }

        public static Microsoft.AspNet.SignalR.IDependencyResolver SignalRResolver { get; private set; }
    }
}