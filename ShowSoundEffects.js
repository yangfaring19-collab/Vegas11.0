import System;
import System.IO;
import System.Drawing;
import System.Text;
import System.Windows.Forms;
import Sony.Vegas;


var soundEffectsForm = null;


function ShowSoundEffects()
{
    // 이미 창이 열려 있다면 기존 창을 앞으로 가져옴
    if (soundEffectsForm != null)
    {
        try
        {
            soundEffectsForm.Activate();
            return;
        }
        catch (e)
        {
            soundEffectsForm = null;
        }
    }

    // Form 생성
    soundEffectsForm = new Form();

    soundEffectsForm.Text = "Sound Effects";
    soundEffectsForm.Width = 600;
    soundEffectsForm.Height = 500;
    soundEffectsForm.StartPosition = FormStartPosition.CenterScreen;

    // ----------------------------------------
    // 제목
    // ----------------------------------------

    var titleLabel = new Label();

    titleLabel.Text = "Sound Effects in Project";
    titleLabel.Dock = DockStyle.Top;
    titleLabel.Height = 35;
    titleLabel.Font = new System.Drawing.Font(
        "Arial",
        12,
        System.Drawing.FontStyle.Bold
    );
    titleLabel.TextAlign = ContentAlignment.MiddleLeft;
    titleLabel.Padding = new Padding(10, 0, 0, 0);

    soundEffectsForm.Controls.Add(titleLabel);


    // ----------------------------------------
    // 효과음 목록
    // ----------------------------------------

    var listView = new ListView();

    listView.Dock = DockStyle.Fill;
    listView.View = View.Details;
    listView.FullRowSelect = true;
    listView.GridLines = true;

    // 컬럼
    listView.Columns.Add("Time", 120);
    listView.Columns.Add("Track", 150);
    listView.Columns.Add("File", 280);

    soundEffectsForm.Controls.Add(listView);


    // ----------------------------------------
    // 현재 프로젝트의 Audio Event 검색
    // ----------------------------------------

    var count = 0;

    for (var track : Track in Vegas.Project.Tracks)
    {
        // Audio Track만 검색
        if (!track.IsAudio())
            continue;

        for (var evnt : TrackEvent in track.Events)
        {
            // Audio Event만 검색
            if (!evnt.IsAudio())
                continue;

            // 현재 사용 중인 Take
            var take = evnt.ActiveTake;

            if (take == null)
                continue;

            if (!take.IsValid())
                continue;

            // 미디어 파일 경로
            var filePath = take.MediaPath;

            if (filePath == null || filePath == "")
                continue;

            // 파일명
            var fileName = Path.GetFileName(filePath);

            // 시작 시간
            var startTime = evnt.Start.ToString();

            // ListView에 추가
            var item = new ListViewItem(startTime);

            item.SubItems.Add(track.Name);
            item.SubItems.Add(fileName);

            listView.Items.Add(item);

            count++;
        }
    }


    // ----------------------------------------
    // 하단 상태 표시
    // ----------------------------------------

    var statusLabel = new Label();

    statusLabel.Text = "Total: " + count;
    statusLabel.Dock = DockStyle.Bottom;
    statusLabel.Height = 30;
    statusLabel.TextAlign = ContentAlignment.MiddleRight;
    statusLabel.Padding = new Padding(0, 0, 10, 0);

    soundEffectsForm.Controls.Add(statusLabel);


    // ----------------------------------------
    // Form 종료 처리
    // ----------------------------------------

    soundEffectsForm.FormClosed += function(sender, args)
    {
        soundEffectsForm = null;
    };


    // ----------------------------------------
    // Form 표시
    // ----------------------------------------

    soundEffectsForm.Show();
}


try
{
    ShowSoundEffects();
}
catch (e)
{
    MessageBox.Show(
        e.toString(),
        "Show Sound Effects - Error"
    );
}