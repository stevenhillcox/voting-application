﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace VotingApplication.Data.Model
{
    public class Option
    {
        public long Id { get; set; }

        public string Name { get; set; }
        public string Description { get; set; }
        public string Info { get; set; }

        public List<OptionSet> OptionSets { get; set; }
    }
}
