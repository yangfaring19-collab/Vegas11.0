import System;
import System.Windows.Forms;
import Sony.Vegas;


function OnTrackEventCountChanged(sender, args)
{
    MessageBox.Show(
        "TrackEventCountChanged!",
        "Vegas Event Test"
    );
}


try
{
    Vegas.Transport.TrackEventCountChanged +=
        OnTrackEventCountChanged;

    MessageBox.Show(
        "Event registered successfully.",
        "Vegas Event Test"
    );
}
catch (e)
{
    MessageBox.Show(
        e.toString(),
        "Event Registration Error"
    );
}