using System.Collections.ObjectModel;

namespace TokenHubPanel.Models
{
    public class AppTool
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string IconPath { get; set; } = string.Empty;
        public string Mark { get; set; } = string.Empty;
        public ObservableCollection<string> ModelIds { get; set; } = new();
        public bool IsNew { get; set; }
    }
}
