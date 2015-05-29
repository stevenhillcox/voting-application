namespace VotingApplication.Data.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class HiddenResultsToDisabledRevoting : DbMigration
    {
        public override void Up()
        {
            AddColumn("dbo.Polls", "DisabledRevoting", c => c.Boolean(nullable: false));
            DropColumn("dbo.Polls", "HiddenResults");
        }
        
        public override void Down()
        {
            AddColumn("dbo.Polls", "HiddenResults", c => c.Boolean(nullable: false));
            DropColumn("dbo.Polls", "DisabledRevoting");
        }
    }
}
