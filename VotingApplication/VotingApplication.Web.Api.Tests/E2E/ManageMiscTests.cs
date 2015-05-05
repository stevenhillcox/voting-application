﻿using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using Protractor;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using VotingApplication.Data.Context;
using VotingApplication.Data.Model;
using VotingApplication.Web.Api.Tests.E2E.Helpers.Clearers;

namespace VotingApplication.Web.Tests.E2E
{
    [TestClass]
    public class ManageMiscTests
    {
        private static readonly string ChromeDriverDir = @"..\..\";
        private static readonly string SiteBaseUri = @"http://localhost:64205/";
        private static readonly int WaitTime = 500;

        private ITestVotingContext _context;
        private Poll _defaultPoll;
        private IWebDriver _driver;

        [TestInitialize]
        public virtual void TestInitialise()
        {
            _context = new TestVotingContext();

            // Open, Anonymous, No Option Adding, Shown Results
            _defaultPoll = new Poll()
            {
                UUID = Guid.NewGuid(),
                ManageId = Guid.NewGuid(),
                PollType = PollType.Basic,
                Name = "Test Poll",
                LastUpdated = DateTime.Now,
                CreatedDate = DateTime.Now,
                Options = new List<Option>(),
                InviteOnly = false,
                NamedVoting = false,
                OptionAdding = false,
                HiddenResults = false,
                MaxPerVote = 3,
                MaxPoints = 4
            };

            _context.Polls.Add(_defaultPoll);
            _context.SaveChanges();

            _driver = new NgWebDriver(new ChromeDriver(ChromeDriverDir));
            _driver.Manage().Timeouts().SetScriptTimeout(TimeSpan.FromSeconds(10));
            _driver.Manage().Timeouts().SetPageLoadTimeout(TimeSpan.FromSeconds(10));
        }

        [TestCleanup]
        public void TestCleanUp()
        {
            _driver.Dispose();

            PollClearer pollTearDown = new PollClearer(_context);
            pollTearDown.ClearPoll(_defaultPoll);
            _context.Dispose();
        }

        [TestMethod, TestCategory("E2E")]
        public void ManageMisc_CancelButton_NavigatesToManagement()
        {
            _driver.Navigate().GoToUrl(SiteBaseUri + "Dashboard/#/Manage/" + _defaultPoll.ManageId + "/Misc");

            IReadOnlyCollection<IWebElement> buttons = _driver.FindElements(By.TagName("button"));
            IWebElement cancelButton = buttons.First(l => l.Text == "Cancel");

            cancelButton.Click();

            Assert.AreEqual(SiteBaseUri + "Dashboard/#/Manage/" + _defaultPoll.ManageId, _driver.Url);
        }

        [TestMethod, TestCategory("E2E")]
        public void ManageMisc_CancelButton_DoesNotSaveChanges()
        {
            _driver.Navigate().GoToUrl(SiteBaseUri + "Dashboard/#/Manage/" + _defaultPoll.ManageId + "/Misc");

            IWebElement inviteOnlySwitch = _driver.FindElement(By.Id("InviteOnly"));
            inviteOnlySwitch.Click();

            IReadOnlyCollection<IWebElement> buttons = _driver.FindElements(By.TagName("button"));
            IWebElement cancelButton = buttons.First(l => l.Text == "Cancel");

            cancelButton.Click();

            Poll dbPoll = _context.Polls.Local.Where(p => p.ManageId == _defaultPoll.ManageId).Single();

            Thread.Sleep(WaitTime);
            _context.ReloadEntity(dbPoll);

            Assert.IsFalse(dbPoll.InviteOnly);
        }

        [TestMethod, TestCategory("E2E")]
        public void ManageMisc_Save_SavesChanges()
        {
            _driver.Navigate().GoToUrl(SiteBaseUri + "Dashboard/#/Manage/" + _defaultPoll.ManageId + "/Misc");

            IWebElement inviteOnlySwitch = _driver.FindElement(By.Id("InviteOnly"));
            IWebElement namedVotingSwitch = _driver.FindElement(By.Id("NamedVoting"));
            IWebElement optionAddingSwitch = _driver.FindElement(By.Id("OptionAdding"));
            IWebElement hiddenResultsSwitch = _driver.FindElement(By.Id("HiddenResults"));

            inviteOnlySwitch.Click();
            namedVotingSwitch.Click();
            optionAddingSwitch.Click();
            hiddenResultsSwitch.Click();

            IReadOnlyCollection<IWebElement> buttons = _driver.FindElements(By.TagName("button"));
            IWebElement saveButton = buttons.First(l => l.Text == "Save");

            saveButton.Click();

            Poll dbPoll = _context.Polls.Local.Where(p => p.ManageId == _defaultPoll.ManageId).Single();

            Thread.Sleep(WaitTime);
            _context.ReloadEntity(dbPoll);

            Assert.IsTrue(dbPoll.InviteOnly);
            Assert.IsTrue(dbPoll.NamedVoting);
            Assert.IsTrue(dbPoll.OptionAdding);
            Assert.IsTrue(dbPoll.HiddenResults);
        }
    }
}