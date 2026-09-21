import System;
import System.IO;
import System.Drawing;
import System.Windows.Forms;
import Sony.Vegas;


// =========================================================
// 전역 변수
// =========================================================

var soundEffectsForm = null;
var soundEffectsListView = null;
var soundEffectsStatusLabel = null;

var refreshTimer = null;

// 현재 RefreshSoundEffects()가 실행 중인지
var isRefreshing = false;

// Timer가 갱신을 요청했는지
var refreshPending = false;


// =========================================================
// Sound Effects 목록 갱신
// =========================================================

function RefreshSoundEffects()
{
    // 이미 갱신 중이면 중복 실행하지 않음
    if (isRefreshing)
    {
        refreshPending = true;
        return;
    }

    if (soundEffectsListView == null)
        return;

    isRefreshing = true;
    refreshPending = false;

    try
    {
        soundEffectsListView.BeginUpdate();

        soundEffectsListView.Items.Clear();

        var count = 0;

        // -------------------------------------------------
        // 모든 Track 검색
        // -------------------------------------------------

        for (var track : Track in Vegas.Project.Tracks)
        {
            // Audio Track만 확인
            if (!track.IsAudio())
                continue;


            // -------------------------------------------------
            // Track 안의 Event 검색
            // -------------------------------------------------

            for (var evnt : TrackEvent in track.Events)
            {
                // Audio Event만 확인
                if (!evnt.IsAudio())
                    continue;


                // -------------------------------------------------
                // Active Take 확인
                // -------------------------------------------------

                var take = evnt.ActiveTake;

                if (take == null)
                    continue;

                if (!take.IsValid())
                    continue;


                // -------------------------------------------------
                // Media Path
                // -------------------------------------------------

                var filePath = take.MediaPath;

                if (filePath == null || filePath == "")
                    continue;


                var fileName = Path.GetFileName(filePath);

                var startTime = evnt.Start.ToString();


                // -------------------------------------------------
                // ListView Item
                // -------------------------------------------------

                var item = new ListViewItem(startTime);

                item.SubItems.Add(track.Name);
                item.SubItems.Add(fileName);

                soundEffectsListView.Items.Add(item);

                count++;
            }
        }


        // -----------------------------------------------------
        // Total 표시
        // -----------------------------------------------------

        if (soundEffectsStatusLabel != null)
        {
            soundEffectsStatusLabel.Text =
                "Total: " + count;
        }
    }
    catch (e)
    {
        // Vegas 프로젝트가 변경되는 순간에는
        // 객체 접근이 일시적으로 실패할 수 있음.
        //
        // 이 경우 오류창을 띄우지 않고 다음 Timer Tick에서
        // 다시 시도하도록 함.
    }
    finally
    {
        soundEffectsListView.EndUpdate();

        isRefreshing = false;
    }


    // ---------------------------------------------------------
    // 갱신 중 새로운 갱신 요청이 들어왔다면
    // 한 번만 다시 실행
    // ---------------------------------------------------------

    if (refreshPending)
    {
        refreshPending = false;

        RefreshSoundEffects();
    }
}


// =========================================================
// Timer Tick
// =========================================================

function OnRefreshTimerTick(sender, args)
{
    // 이미 갱신 중이면 이번 Tick은 무시
    if (isRefreshing)
    {
        refreshPending = true;
        return;
    }

    RefreshSoundEffects();
}


// =========================================================
// Timer 시작
// =========================================================

function StartRefreshTimer()
{
    if (refreshTimer != null)
        return;


    refreshTimer = new System.Windows.Forms.Timer();

    // 500ms마다 확인
    refreshTimer.Interval = 500;

    refreshTimer.Tick += OnRefreshTimerTick;

    refreshTimer.Start();
}


// =========================================================
// Timer 종료
// =========================================================

function StopRefreshTimer()
{
    if (refreshTimer == null)
        return;


    try
    {
        refreshTimer.Stop();

        refreshTimer.Tick -= OnRefreshTimerTick;

        refreshTimer.Dispose();
    }
    catch (e)
    {
    }


    refreshTimer = null;
}


// =========================================================
// Form 생성
// =========================================================

function ShowSoundEffects()
{
    // -----------------------------------------------------
    // 이미 창이 열려 있으면 기존 창 활성화
    // -----------------------------------------------------

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


    // =====================================================
    // 제목
    // =====================================================

    var titleLabel = new Label();

    titleLabel.Text = "Sound Effects in Project";

    titleLabel.Dock = DockStyle.Top;
    titleLabel.Height = 35;

    titleLabel.Font =
        new System.Drawing.Font(
            "Arial",
            12,
            System.Drawing.FontStyle.Bold
        );

    titleLabel.TextAlign =
        ContentAlignment.MiddleLeft;

    titleLabel.Padding =
        new Padding(10, 0, 0, 0);

    soundEffectsForm.Controls.Add(titleLabel);


    // =====================================================
    // ListView
    // =====================================================

    soundEffectsListView = new ListView();

    soundEffectsListView.Dock = DockStyle.Fill;

    soundEffectsListView.View =
        View.Details;

    soundEffectsListView.FullRowSelect =
        true;

    soundEffectsListView.GridLines =
        true;


    // Columns

    soundEffectsListView.Columns.Add(
        "Time",
        120
    );

    soundEffectsListView.Columns.Add(
        "Track",
        150
    );

    soundEffectsListView.Columns.Add(
        "File",
        280
    );


    soundEffectsForm.Controls.Add(
        soundEffectsListView
    );


    // =====================================================
    // Status Label
    // =====================================================

    soundEffectsStatusLabel = new Label();

    soundEffectsStatusLabel.Text =
        "Total: 0";

    soundEffectsStatusLabel.Dock =
        DockStyle.Bottom;

    soundEffectsStatusLabel.Height =
        30;

    soundEffectsStatusLabel.TextAlign =
        ContentAlignment.MiddleRight;

    soundEffectsStatusLabel.Padding =
        new Padding(0, 0, 10, 0);

    soundEffectsForm.Controls.Add(
        soundEffectsStatusLabel
    );


    // =====================================================
    // Form 종료 처리
    // =====================================================

    soundEffectsForm.FormClosed +=
        function(sender, args)
        {
            // Timer 종료
            StopRefreshTimer();


            // 객체 정리
            soundEffectsListView = null;

            soundEffectsStatusLabel = null;

            soundEffectsForm = null;

            isRefreshing = false;

            refreshPending = false;
        };


    // =====================================================
    // 최초 목록 생성
    // =====================================================

    RefreshSoundEffects();


    // =====================================================
    // Timer 시작
    // =====================================================

    StartRefreshTimer();


    // =====================================================
    // Form 표시
    // =====================================================

    soundEffectsForm.Show();
}


// =========================================================
// Script 실행
// =========================================================

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