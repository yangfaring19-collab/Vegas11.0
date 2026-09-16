import System;
import System.Windows.Forms;
import System.Text;
import Sony.Vegas;


try
{
    var result = new StringBuilder();

    result.AppendLine("Sound Effects in Project");
    result.AppendLine("========================");
    result.AppendLine("");

    var count = 0;

    // 모든 Track을 순회
    for (var track : Track in Vegas.Project.Tracks)
    {
        // Audio Track만 확인
        if (!track.IsAudio())
            continue;

        // 해당 Track의 모든 Event를 순회
        for (var evnt : TrackEvent in track.Events)
        {
            // Audio Event만 확인
            if (!evnt.IsAudio())
                continue;

            // Event의 모든 Take를 확인
            for (var take : Take in evnt.Takes)
            {
                var filePath = take.MediaPath;

                if (filePath == null || filePath == "")
                    continue;

                count++;

                // 파일명만 추출
                var fileName = System.IO.Path.GetFileName(filePath);

                // 시간
                var startTime = evnt.Start.ToString();

                // 트랙 이름
                var trackName = track.Name;

                result.AppendLine(
                    startTime +
                    "    " +
                    trackName +
                    "    " +
                    fileName
                );
            }
        }
    }

    if (count == 0)
    {
        result.AppendLine("사용된 효과음을 찾을 수 없습니다.");
    }
    else
    {
        result.AppendLine("");
        result.AppendLine("------------------------");
        result.AppendLine("Total: " + count);
    }

    MessageBox.Show(
        result.ToString(),
        "Sound Effects"
    );
}
catch (e)
{
    MessageBox.Show(
        e.ToString(),
        "Show Sound Effects - Error"
    );
}
```
