import System;
import System.IO;
import System.Drawing;
import System.Windows.Forms;
import Sony.Vegas;


var soundEffectsForm = null;
var soundEffectsListView = null;
var soundEffectsStatusLabel = null;


// ---------------------------------------------------------
// 목록 갱신
// ---------------------------------------------------------
function RefreshSoundEffects()
{
    if (soundEffectsListView == null)
        return;

    try
    {
        soundEffectsListView.BeginUpdate();

        soundEffectsListView.Items.Clear();

        var count = 0;

        for (var track : Track in Vegas.Project.Tracks)
        {
            if (!track.IsAudio())
                continue;

            for (var evnt : TrackEvent in track.Events)
            {
                if (!evnt.IsAudio())
                    continue;

                var take = evnt.ActiveTake;

                if (take == null)
                    continue;

                if (!take.IsValid())
                    continue;

                var filePath = take.MediaPath;

                if (filePath == null || filePath == "")
                    continue;

                var fileName = Path.GetFileName(filePath);
                var startTime = evnt.Start.ToString();

                var item = new ListViewItem(startTime);

                item.SubItems.Add(track.Name);
                item.SubItems.Add(fileName);

                soundEffectsListView.Items.Add(item);

                count++;
            }
        }

        if (soundEffectsStatusLabel != null)
        {
            soundEffectsStatusLabel.Text = "Total: " + count;
        }
    }
    catch (e)
    {
        // 프로젝트가 변경되는 순간에는
        // Vegas 객체가 일시적으로 접근 불가능할 수 있으므로
        // 갱신 실패는 무시하고 다음 변경을 기다립니다.
    }
    finally
    {
        soundEffectsListView.EndUpdate();
    }
}


// ---------------------------------------------------------
// Vegas 프로젝트 변경 이벤트
// ---------------------------------------------------------

function OnTrackCountChanged(sender, args)
{
    RefreshSoundEffects();
}


function OnTrackEventCountChanged(sender, args)
{
    RefreshSoundEffects();
}


function OnTrackEventTimeChanged(sender, args)
{
    RefreshSoundEffects();
}


function OnTrackEventStateChanged(sender, args)
{
    RefreshSoundEffects();
}


// ---------------------------------------------------------
// Vegas 이벤트 등록
// ---------------------------------------------------------
function RegisterVegasEvents()
{
    Vegas.Transport.TrackCountChanged += OnTrackCountChanged;
    Vegas.Transport.TrackEventCountChanged += OnTrackEventCountChanged;
    Vegas.Transport.TrackEventTimeChanged += OnTrackEventTimeChanged;
    Vegas.Transport.TrackEventStateChanged += OnTrackEventStateChanged;
}


// ---------------------------------------------------------
// Vegas 이벤트 해제
// ---------------------------------------------------------
function UnregisterVegasEvents()
{
    try
    {
        Vegas.Transport.TrackCountChanged -= OnTrackCountChanged;
        Vegas.Transport.TrackEventCountChanged -= OnTrackEventCountChanged;
        Vegas.Transport.TrackEventTimeChanged -= OnTrackEventTimeChanged;
        Vegas.Transport.TrackEventStateChanged -= OnTrackEventStateChanged;
    }
    catch (e)
    {
    }
}


// ---------------------------------------------------------
// Form 생성
// ---------------------------------------------------------
function ShowSoundEffects()
{
    // 이미 열려 있으면 기존 창을 활성화
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


    // -----------------------------------------------------
    // Form
    // -----------------------------------------------------

    soundEffectsForm = new Form();

    soundEffectsForm.Text = "Sound Effects";
    soundEffectsForm.Width = 600;
    soundEffectsForm.Height = 500;
    soundEffectsForm.StartPosition =
        FormStartPosition.CenterScreen;


    // -----------------------------------------------------
    // 제목
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // ListView
    // -----------------------------------------------------

    soundEffectsListView = new ListView();

    soundEffectsListView.Dock = DockStyle.Fill;
    soundEffectsListView.View = View.Details;
    soundEffectsListView.FullRowSelect = true;
    soundEffectsListView.GridLines = true;

    soundEffectsListView.Columns.Add("Time", 120);
    soundEffectsListView.Columns.Add("Track", 150);
    soundEffectsListView.Columns.Add("File", 280);

    soundEffectsForm.Controls.Add(soundEffectsListView);


    // -----------------------------------------------------
    // 상태 표시
    // -----------------------------------------------------

    soundEffectsStatusLabel = new Label();

    soundEffectsStatusLabel.Text = "Total: 0";
    soundEffectsStatusLabel.Dock = DockStyle.Bottom;
    soundEffectsStatusLabel.Height = 30;

    soundEffectsStatusLabel.TextAlign =
        ContentAlignment.MiddleRight;

    soundEffectsStatusLabel.Padding =
        new Padding(0, 0, 10, 0);

    soundEffectsForm.Controls.Add(
        soundEffectsStatusLabel
    );


    // -----------------------------------------------------
    // Form 종료
    // -----------------------------------------------------

    soundEffectsForm.FormClosed += function(sender, args)
    {
        UnregisterVegasEvents();

        soundEffectsListView = null;
        soundEffectsStatusLabel = null;
        soundEffectsForm = null;
    };


    // -----------------------------------------------------
    // Vegas 이벤트 등록
    // -----------------------------------------------------

    RegisterVegasEvents();


    // -----------------------------------------------------
    // 최초 목록 생성
    // -----------------------------------------------------

    RefreshSoundEffects();


    // -----------------------------------------------------
    // Form 표시
    // -----------------------------------------------------

    soundEffectsForm.Show();
}


// ---------------------------------------------------------
// 실행
// ---------------------------------------------------------

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